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
	private messagesList: MessagePayload[] = [];

	constructor(private authService: AuthService) {}

	@WebSocketServer()
	server: Server;

	public afterInit() {
		this.logger.verbose(`WebSocket Server Initialized & total: [${this.summaryClient}]`);
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

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connected [${clientNick}] & total: [${this.summaryClient}]`);

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

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Disconnected [${clientNick}] & total: [${this.summaryClient}]`);

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

		this.logger.verbose(`NEW message: [${authMember?.memberNick ?? 'Guest'}] ${text}`);

		this.messagesList.push(newMessage);
		if (this.messagesList.length > HISTORY_LIMIT) this.messagesList.splice(0, this.messagesList.length - HISTORY_LIMIT);

		this.emitMessage(newMessage);
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
