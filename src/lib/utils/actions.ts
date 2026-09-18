import { errorMessage } from "@/lib/errors";

export type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string };

export async function actionResult<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { data: await work() };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
