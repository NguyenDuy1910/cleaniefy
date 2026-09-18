"use server";

import { actionResult } from "@/lib/utils/actions";
import { createSession, deleteSession } from "@/lib/auth/session";
import { authenticate, createAccount } from "./service";

export async function loginAction(input: unknown) {
  return actionResult(async () => {
    const result = await authenticate(input);
    await createSession({ userId: result.user.id, email: result.user.email, isAdmin: result.user.isAdmin });
    return result;
  });
}

export async function signUpAction(input: unknown) {
  return actionResult(async () => {
    const result = await createAccount(input);
    await createSession({ userId: result.user.id, email: result.user.email, isAdmin: result.user.isAdmin });
    return result;
  });
}

export async function logoutAction() {
  await deleteSession();
}
