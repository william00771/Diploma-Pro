using MimeKit;
using MimeKit.Text;
using MailKit.Net.Smtp;

namespace Backend.Services
{
    public class EmailService
    {
        private readonly string _email;
        private readonly string _appPassword;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _email = configuration["EmailSettings:Email"];
            _appPassword = configuration["EmailSettings:AppPassword"]; 
            _logger = logger;
        }

        public async Task SendEmailWithAttachmentAsync(string receiverEmail, string subject, string HtmlBody)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("DiplomaMakers", _email));
            message.To.Add(new MailboxAddress("Student", receiverEmail));
            message.Subject = subject;
            message.Body = new TextPart(TextFormat.Html) { Text = HtmlBody };

            using (var client = new SmtpClient())
            {
                try
                {
                    await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync(_email, _appPassword); 
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while sending email.");
                }
            }
        }
    }
}
