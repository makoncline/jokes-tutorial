import {
  ActionFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/server-runtime";
import { logout } from "~/utils/session.server";

export const action: ActionFunction = ({ request }) => logout(request);

export const loader: LoaderFunction = () => redirect("/");
