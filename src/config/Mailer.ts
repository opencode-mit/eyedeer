import nodemailer from 'nodemailer';

let transporter: any;

export async function configure() {
    const options = {
        host: process.env["EMAIL_HOST"]!,
        port: Number.parseInt(process.env["EMAIL_PORT"]!),
        secure: process.env["EMAIL_SECURE"]! === 'true',
        auth: {
            user: process.env["EMAIL_USERNAME"]!,
            pass: process.env["EMAIL_PASSWORD"]!,
        },
        logger: true
    };

    transporter = nodemailer.createTransport(options);

    // await transporter.sendMail({
    //     sender: "adhami@mit.edu",
    //     to: "adhami@mit.edu",
    //     subject: "eyedeer server is up eom"
    // });
}

export async function sendEmail(options: {to: string, subject: string, body: string}): Promise<void> {
    console.log(`sending email to ${options.to}`);
    await transporter.sendMail({
        sender: 'eyedeer@mit.edu',
        to: options.to,
        subject: options.subject,
        text: options.body
    });
}