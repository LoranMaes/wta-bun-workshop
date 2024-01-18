import { init, addUser, getMessages, closeDb } from "./database";
import { appendFile } from "node:fs/promises";

const server = Bun.serve({
  port: Bun.env.PORT,

  async fetch(req: Request) {
    init();
    // const resp = database()
    // let answer = ""
    // for (const name in resp) {
    //   answer += resp[name].name
    // }

    const url = new URL(req.url);
    const errors = {
      name: "",
      message: "",
      image: "",
    };

    if (url.pathname === "/") {
      return new Response(Bun.file("index.html"), {
        headers: {
          "Content-Type": "text/html",
        },
        status: 200,
      });
    }

    if (url.pathname === "/form") {
      let formData;
      try {
        formData = await req.formData();
      } catch (e) {
        return new Response(JSON.stringify({ message: "No form data" }), {
          status: 400,
          statusText: "Bad Request",
        });
      }
      const name: string = formData.get("name") + "";
      const message: string = formData.get("message") + "";
      const image: File | null = formData.get("image") as File | null;

      if (!name) errors["name"] = "Please fill in a valid name";
      if (!message) errors["message"] = "Please fill in a valid message";
      if (image !== null && image !== undefined) {
        if (!image.type || !image.type.includes("image")) {
          errors["image"] = "Please upload a valid image";
        }
      } else {
        errors["image"] = "Please upload an image";
      }

      if (Object.keys(errors).some((e) => errors[e as keyof typeof errors])) {
        const nonEmptyErrors = Object.keys(errors)
          .filter((e) => errors[e as keyof typeof errors])
          .reduce((obj, key) => {
            obj[key] = errors[key as keyof typeof errors];
            return obj;
          }, {} as { [key: string]: string });

        return new Response(
          JSON.stringify({
            message: "Please fill in the required forms",
            data: nonEmptyErrors,
          }),
          {
            status: 400,
            statusText: "Bad Request",
          }
        );
      }

      let imageFilename: string | null = null;
      if (image) {
        const sanitizedImageName = image.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const timestamp = new Date().getTime();
        imageFilename = `${timestamp}_${sanitizedImageName}`;
        Bun.write(`./uploads/${imageFilename}`, image);
      }

      let add;
      try {
        add = addUser({ name, message }, imageFilename as string);
      } catch (err) {
        return new Response(
          JSON.stringify({
            message: "Failed to add user",
          }),
          {
            status: 500,
            statusText: "Internal Server Error",
          }
        );
      }

      if (!add) {
        return new Response(
          JSON.stringify({
            message: "Failed to add user",
          }),
          {
            status: 500,
            statusText: "Internal Server Error",
          }
        );
      }
      return new Response(
        JSON.stringify({
          message: "Success",
          data: { name, message },
        }),
        {
          status: 200,
          statusText: "OK",
        }
      );
      // const path = "names.txt"
      // await Bun.write(path, name)
      // await appendFile(path, name + "\n")
    }

    if (url.pathname === "/messages") {
      const messages = getMessages();
      return new Response(
        JSON.stringify({
          message: "Messages succesfully fetched",
          data: messages,
        }),
        {
          status: 200,
          statusText: "OK",
        }
      );
    }

    if (url.pathname.startsWith("/uploads")) {
      const path = url.pathname.replace("/uploads", "./uploads");
      let file;
      try {
        file = Bun.file(path);
      } catch (err) {
        return new Response(
          JSON.stringify({
            message: "File not found",
          }),
          {
            status: 404,
            statusText: "Not Found",
          }
        );
      }
      return new Response(file, {
        headers: {
          "Content-Type": "image/png",
        },
        status: 200,
      });
    }

    return new Response(`Hello world ${""}`);
  },
  // Optional port number - the default value is 3000
});

console.log(`Listening on ${server.url}`);
