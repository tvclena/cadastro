import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao processar arquivo" });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const buffer = fs.readFileSync(file.filepath);
    const ext = file.originalFilename.split(".").pop();
    const name = `${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const bunnyUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/capas/${name}`;

    const upload = await fetch(bunnyUrl, {
      method: "PUT",
      headers: {
        AccessKey: process.env.BUNNY_API_KEY,
        "Content-Type": file.mimetype,
      },
      body: buffer,
    });

    if (!upload.ok) {
      return res.status(500).json({ error: "Erro ao enviar para Bunny" });
    }

    return res.status(200).json({
      url: `${process.env.BUNNY_CDN_URL}/capas/${name}`,
    });
  });
}
