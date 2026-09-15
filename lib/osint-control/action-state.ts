export interface InviteActionState {
  ok: boolean;
  message: string;
  token?: string;
}

export interface PlainActionState {
  ok: boolean;
  message: string;
}

export const initialInviteState: InviteActionState = { ok: false, message: '' };
export const initialPlainState: PlainActionState = { ok: false, message: '' };
