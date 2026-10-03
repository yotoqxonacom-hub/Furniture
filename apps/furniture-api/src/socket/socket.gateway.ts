import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import * as WebSocket from 'ws';
import { Server } from 'ws';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';

interface MessagePayload {
	event: string;
	id: string;
	text: string;
	memberData: Member | null;
	createdAt: string;
	/** true once someone other than the author has seen it (client shows two ticks) */
	read: boolean;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member | null;
	action: string;
}

const HISTORY_LIMIT = 10;

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClient: number = 0;
	private clientsAuthMap = new Map<WebSocket, Member | null>();
	/** memberId -> open sockets of that member (several tabs / devices) */
	private memberSockets = new Map<string, Set<WebSocket>>();
	private messagesList: MessagePayload[] = [];
	/** message id -> who wrote it (member id, or the socket for guests) */
	private messageAuthors = new Map<string, string | WebSocket>();

	constructor(private authService: AuthService) {}

	@WebSocketServer()
	server: Server;

	public afterInit() {
		this.logger.log(`WebSocket Server Initialized & total: [${this.summaryClient}]`);
	}

	/** token comes as a query param: ws://host:port?token=JWT ; guests have no valid token */
	private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const { searchParams } = new URL(req?.url ?? '/', 'http://localhost');
			const token = searchParams.get('token');
			if (!token || token === 'null' || token === 'undefined') return null;
			return await this.authService.verifyToken(token);
		} catch (err) {
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: any) {
		const authMember: Member | null = await this.retrieveAuth(req);
		this.summaryClient++;
		this.clientsAuthMap.set(client, authMember);
		if (authMember?._id) {
			const key = String(authMember._id);
			if (!this.memberSockets.has(key)) this.memberSockets.set(key, new Set());
			this.memberSockets.get(key)!.add(client);
		}

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.log(`Connected [${clientNick}] & total: [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: authMember,
			action: 'joined',
		};
		this.emitMessage(infoMsg); // to all clients
		client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList })); // history only to the new client
	}

	public handleDisconnect(client: WebSocket) {
		const authMember = this.clientsAuthMap.get(client) ?? null;
		this.summaryClient = Math.max(0, this.summaryClient - 1);
		this.clientsAuthMap.delete(client);
		if (authMember?._id) {
			const key = String(authMember._id);
			const sockets = this.memberSockets.get(key);
			sockets?.delete(client);
			if (sockets && sockets.size === 0) this.memberSockets.delete(key);
		}

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.log(`Disconnected [${clientNick}] & total: [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: authMember,
			action: 'left',
		};
		this.broadcastMessage(client, infoMsg); // to everyone except the leaving client
	}

	@SubscribeMessage('message')
	public handleMessage(client: WebSocket, payload: any): void {
		const text = typeof payload === 'string' ? payload.trim().slice(0, 500) : '';
		if (!text) return;

		const authMember = this.clientsAuthMap.get(client) ?? null;
		const newMessage: MessagePayload = {
			event: 'message',
			id: randomUUID(),
			text,
			memberData: authMember,
			createdAt: new Date().toISOString(),
			read: false,
		};
		this.messageAuthors.set(newMessage.id, this.authorKey(client));

		this.logger.log(`NEW message: [${authMember?.memberNick ?? 'Guest'}] ${text}`);

		this.messagesList.push(newMessage);
		if (this.messagesList.length > HISTORY_LIMIT) {
			const removed = this.messagesList.splice(0, this.messagesList.length - HISTORY_LIMIT);
			removed.forEach((message) => this.messageAuthors.delete(message.id));
		}

		this.emitMessage(newMessage);
	}

	/**
	 * Community read receipts: a client reports the ids it has on screen.
	 * The first reader who is not the author marks the message read and everyone gets `publicRead`.
	 */
	@SubscribeMessage('readPublic')
	public handleReadPublic(client: WebSocket, payload: any): void {
		if (!Array.isArray(payload)) return;
		const reader = this.authorKey(client);
		const newlyRead: string[] = [];
		payload.slice(0, HISTORY_LIMIT).forEach((id) => {
			const message = this.messagesList.find((item) => item.id === id);
			if (!message || message.read) return;
			if (this.messageAuthors.get(id) === reader) return; // reading your own message does not count
			message.read = true;
			newlyRead.push(id);
		});
		if (newlyRead.length) this.emitMessage({ event: 'publicRead', ids: newlyRead });
	}

	/** members are identified by id (all their tabs are one reader), guests by their socket */
	private authorKey(client: WebSocket): string | WebSocket {
		const member = this.clientsAuthMap.get(client);
		return member?._id ? String(member._id) : client;
	}

	/** Push an event to every open socket of the given members (private messages, read receipts) */
	public emitToMembers(memberIds: Array<string | { toString(): string }>, payload: Record<string, any>): void {
		const data = JSON.stringify(payload);
		const unique = new Set(memberIds.map((id) => String(id)));
		unique.forEach((id) => {
			this.memberSockets.get(id)?.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) client.send(data);
			});
		});
	}

	public isOnline(memberId: string | { toString(): string }): boolean {
		return (this.memberSockets.get(String(memberId))?.size ?? 0) > 0;
	}

	private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client !== sender && client.readyState === WebSocket.OPEN) client.send(JSON.stringify(message));
		});
	}

	private emitMessage(message: InfoPayload | MessagePayload | { event: 'publicRead'; ids: string[] }) {
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(message));
		});
	}
}
