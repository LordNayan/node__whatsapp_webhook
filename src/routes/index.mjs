import * as express from "express";
const router = express.Router();
import { default as axios } from "axios";
import DB from "../models/sqlModel.mjs";
import moment from "moment-timezone";
const db = new DB();

router.post("/webhook", async (req, res) => {
  // Check the Incoming webhook message
  // console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages

  if (
    req.body.object &&
    req.body.entry &&
    req.body.entry[0].changes &&
    req.body.entry[0].changes[0] &&
    req.body.entry[0].changes[0].field === "messages"
  ) {
    let msg_body,
      media_id = null,
      file_type = null,
      media_url = "",
      file_size = 0,
      message_id = "",
      conversation_id = "",
      timestamp = "",
      sender = "",
      receiver = "",
      message_status = "",
      received_body_type = null;

    if (
      //Recieve Scenario
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let message_content = req.body.entry[0].changes[0].value.messages[0];
      message_status = "received";
      receiver =
        req.body.entry[0].changes[0].value.metadata.display_phone_number;
      sender = message_content.from;
      timestamp = message_content.timestamp;
      message_id = message_content.id;
      conversation_id = req.body.entry[0].id;
      if (message_content.text) {
        msg_body = message_content.text.body;
        received_body_type = "text";
      } else if (message_content.image) {
        msg_body = message_content.image;
        media_id = msg_body.id;
        msg_body = msg_body.caption ? msg_body.caption : "";
        received_body_type = "image";
      } else if (message_content.video) {
        msg_body = message_content.video;
        media_id = msg_body.id;
        msg_body = msg_body.caption ? msg_body.caption : "";
        received_body_type = "video";
      } else if (message_content.document) {
        msg_body = message_content.document;
        media_id = msg_body.id;
        msg_body = msg_body.filename;
        received_body_type = "document";
      } else if (message_content.location) {
        msg_body = message_content.location;
        msg_body = JSON.stringify(msg_body);
        received_body_type = "location";
      } else if (message_content.audio) {
        msg_body = message_content.audio;
        media_id = msg_body.id;
        received_body_type = "audio";
      } else if (message_content.contacts) {
        msg_body = message_content.contacts;
        msg_body = JSON.stringify(msg_body[0]);
        received_body_type = "contact";
      }

      if (typeof msg_body != "string") {
        msg_body = null;
      }

      //get media details
      if (media_id) {
        try {
          const media_data = await axios({
            method: "GET",
            url: `https://graph.facebook.com/v16.0/${media_id}/`,
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
          });
          media_url = media_data.data.url;
          file_type = media_data.data.mime_type;
          file_size = media_data.data.file_size;
        } catch (err) {
          console.log("No media data found");
        }
      }

      // axios({
      //   method: "POST",
      //   url:
      //     "https://graph.facebook.com/v12.0/" +
      //     phone_number_id +
      //     "/messages?access_token=" +
      //     token,
      //   data: {
      //     messaging_product: "whatsapp",
      //     to: from,
      //     text: { body: "Ack: " },
      //   },
      //   headers: { "Content-Type": "application/json" },
      // });
    } else if (
      //Send Scenario
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.statuses &&
      req.body.entry[0].changes[0].value.statuses[0]
    ) {
      let message_content = req.body.entry[0].changes[0].value.statuses[0];
      message_status = message_content.status;
      timestamp = message_content.timestamp;
      sender = req.body.entry[0].changes[0].value.metadata.display_phone_number;
      receiver = message_content.recipient_id;
      message_id = message_content.id;
      conversation_id = req.body.entry[0].id;
    }
    console.log("media_url ==> ", media_url);
    console.log("file_type ==> ", file_type);
    console.log("file_size ==> ", file_size);
    console.log("msg_body ==> ", msg_body);
    console.log("timestamp ==> ", timestamp);
    console.log("message_status ==> ", message_status);
    console.log("sender ==> ", sender);
    console.log("receiver ==> ", receiver);
    console.log("message_id ==> ", message_id);
    console.log("conversation_id ==> ", conversation_id);
    await db.upsertRecords(
      "messages",
      "message_id,conversation_id,sender_id,receiver_id,status,received_body_type,message_body,media_url,file_type,file_size,timestamp",
      "?,?,?,?,?,?,?,?,?,?,?",
      [
        message_id,
        conversation_id,
        sender,
        receiver,
        message_status,
        received_body_type,
        msg_body,
        media_url,
        file_type,
        file_size,
        timestamp,
      ],
      message_status
    );
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

router.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

export default router;
