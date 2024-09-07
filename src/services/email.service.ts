import { transporter } from "../utils/transporter";

const sendEmail = async (email: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `PlayGround Team <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject,
      html,
    });

    return info;
  } catch (error) {}
};

export { sendEmail };
