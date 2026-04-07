import type { AuthMode } from "@/lib/auth/navigation";

export type AuthFieldErrors = {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
};

export type AuthDefaultValues = {
  email: string;
  firstName: string;
  lastName: string;
  next: string;
};

export type AuthActionState = {
  defaultValues: AuthDefaultValues;
  fieldErrors: AuthFieldErrors;
  formError: string | null;
  mode: AuthMode;
};

export function createInitialAuthActionState({
  mode = "signin",
  next = "/account",
}: {
  mode?: AuthMode;
  next?: string;
} = {}): AuthActionState {
  return {
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      next,
    },
    fieldErrors: {},
    formError: null,
    mode,
  };
}

export const initialAuthActionState: AuthActionState = createInitialAuthActionState();
