import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { Server } from 'ws';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member | null;
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
		const newMessage: MessagePayload = { event: 'message', text, memberData: authMember };

		this.logger.log(`NEW message: [${authMember?.memberNick ?? 'Guest'}] ${text}`);

		this.messagesList.push(newMessage);
		if (this.messagesList.length > HISTORY_LIMIT) this.messagesList.splice(0, this.messagesList.length - HISTORY_LIMIT);

		this.emitMessage(newMessage);
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

	private emitMessage(message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(message));
		});
	}
}
