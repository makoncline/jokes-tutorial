import { ActionFunction, redirect } from "@remix-run/server-runtime";
import { useActionData } from "remix";
import { db } from "~/utils/db.server";

function validateJokeName(name: string): string | undefined {
  if (!name) return "Name is required";
  if (name.length < 3) return "Name must be at least 3 characters";
  if (name.length > 20) return "Name must be less than 20 characters";
  return undefined;
}

function validateJokeContent(content: string): string | undefined {
  if (!content) return "Content is required";
  if (content.length < 10) return "Content must be at least 3 characters";
  if (content.length > 500) return "Content must be less than 500 characters";
  return undefined;
}

type ActionData = {
  formError?: string;
  fields?: { name?: string; content?: string };
  fieldErrors?: { name?: string; content?: string };
};

export const action: ActionFunction = async ({
  request,
}): Promise<Response | ActionData> => {
  const form = await request.formData();
  let name = form.get("name");
  let content = form.get("content");
  if (typeof name !== "string" || typeof content !== "string") {
    return {
      formError: "Form submitted incorrectly",
    };
  }

  let fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return { fieldErrors, fields: { name, content } };
  }

  const joke = await db.joke.create({
    data: { name, content },
  });
  return redirect(`/jokes/${joke.id}`);
};

export default function NewJokeRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <form method="post">
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-describedby={
                actionData?.fieldErrors?.name ? "name-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{" "}
            <textarea
              defaultValue={actionData?.fields?.content}
              name="content"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.content) || undefined
              }
              aria-describedby={
                actionData?.fieldErrors?.content ? "content-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
