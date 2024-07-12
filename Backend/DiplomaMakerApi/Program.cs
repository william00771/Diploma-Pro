using Microsoft.EntityFrameworkCore;
using JokesAPI.Configuration;
using DiplomaMakerApi.Services;

var builder = WebApplication.CreateBuilder(args);

/* var logger = LoggerFactory.Create(loggingBuilder => 
{
    loggingBuilder.AddConsole();
}).CreateLogger<Program>();
logger.LogInformation("Connection string: {ConnectionString}", connectionstr); */
if(!builder.Environment.IsDevelopment()) {
    builder.WebHost.UseKestrel(options =>
    {
        var port = Environment.GetEnvironmentVariable("PORT") ?? "8080"; 
        options.ListenAnyIP(int.Parse(port));
    });
}

string? connectionstr = builder.Environment.IsDevelopment() ?
                        builder.Configuration.GetConnectionString("PostgreSQLConnectionLocal") :
                        Environment.GetEnvironmentVariable("PostgreConnection");


builder.Services.AddDbContext<DiplomaMakingContext>(options =>
    options.UseNpgsql(connectionstr ?? throw new InvalidOperationException("Connection string 'DiplomaMakingContext' not found.")));
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors();
builder.Services.AddAutoMapper(typeof(AutomapperConfig));
builder.Services.AddScoped<BootcampService>();
builder.Services.AddScoped<StudentService>();
builder.Services.AddScoped<TemplateService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddTransient<LocalFileStorageService>();
builder.Services.AddLogging();

var app = builder.Build();
app.UseCors(builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{   
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        SeedData.Initialize(services);
    }
  
}

app.UseSwagger();

app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();