using System.IO.Compression;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using Syncfusion.PdfToImageConverter;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;

namespace DiplomaMakerApi.Services
{
    public class FileUtilityService
    {
        private readonly ILogger<FileUtilityService> _logger;

        public FileUtilityService(ILogger<FileUtilityService> logger)
        {
            _logger = logger;
        }

        public byte[] CreateZipFromFiles(IEnumerable<string> filePaths, string zipFileName)
        {
            using (var memoryStream = new MemoryStream())
            {
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    foreach (var filePath in filePaths)
                    {
                        var entry = archive.CreateEntry(Path.GetFileName(filePath));
                        using (var entryStream = entry.Open())
                        using (var fileStream = new FileStream(filePath, FileMode.Open))
                        {
                            fileStream.CopyTo(entryStream);
                        }
                    }
                }

                return memoryStream.ToArray();
            }
        }

        public byte[] CreateZipFromStreams(IEnumerable<(Stream Stream, string FileName)> files)
        {
            using (var memoryStream = new MemoryStream())
            {
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    foreach (var file in files)
                    {
                        var entry = archive.CreateEntry(file.FileName);
                        using (var entryStream = entry.Open())
                        {
                            file.Stream.CopyTo(entryStream);
                        }
                    }
                }

                return memoryStream.ToArray();
            }
        }

        public async Task<IFormFile> ConvertPngToWebP(IFormFile formFile, string fileName, bool lowQuality = false)
        {
            if (formFile == null || !formFile.ContentType.Contains("image/png"))
            {
                throw new ArgumentException("Invalid file format. Must be .png");
            }

            using var inStream = new MemoryStream();
            await formFile.CopyToAsync(inStream);
            inStream.Position = 0;

            using var myImage = await SixLabors.ImageSharp.Image.LoadAsync(inStream);

            using var outStream = new MemoryStream();

            if(lowQuality)
            {
                myImage.Mutate(x => x.Resize(new ResizeOptions
                {
                    Size = new SixLabors.ImageSharp.Size(92, 129),
                    Mode = ResizeMode.Max
                }));

                await myImage.SaveAsync(outStream, new WebpEncoder(){
                    FileFormat = WebpFileFormatType.Lossy,
                    Quality = 0,
                });
            }
            else
            {
                await myImage.SaveAsync(outStream, new WebpEncoder(){
                    FileFormat = WebpFileFormatType.Lossy,
                });
            }

            outStream.Position = 0;

            var webpFileName = Path.ChangeExtension(fileName, ".webp");
           
            var webpStreamCopy = new MemoryStream(outStream.ToArray());  // To fix "Cannot access a closed Stream." error

            var webpFormFile = new FormFile(webpStreamCopy, 0, webpStreamCopy.Length, "file", webpFileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/webp"
            };

            return webpFormFile;
        }

        public Task<string> GetRelativePathAsync(string fullFilePath, string directoryName)
        {
            var startIndex = fullFilePath.IndexOf(directoryName);

            if (startIndex == -1)
            {
                throw new ArgumentException("Directory name not found in the path.");
            }

            var relativePath = fullFilePath.Substring(startIndex);
            var normalizedPath = relativePath.Replace('\\', '/');

            return Task.FromResult(normalizedPath);
        }

        public async Task<IFormFile> ConvertPdfToPng(string base64String, string fileName)
        {
            if (string.IsNullOrEmpty(base64String))
            {
                _logger.LogError("Base64 string is null or empty.");
                throw new ArgumentException("Base64 string cannot be null or empty.");
            }
            try
            {
                byte[] pdfBytes = Convert.FromBase64String(base64String);

                _logger.LogInformation("PDF bytes successfully converted from base64. Length: {Length}", pdfBytes.Length);

                using (MemoryStream pdfStream = new MemoryStream(pdfBytes))
                {
                    PdfToImageConverter imageConverter = new PdfToImageConverter();
                    _logger.LogInformation("Loaded PDF stream. Starting conversion...");

                    imageConverter.Load(pdfStream);

                    using (Stream imageStream = imageConverter.Convert(0, false, false))
                    {
                        _logger.LogInformation("PDF conversion successful. Processing image...");

                        imageStream.Position = 0;

                        using (var image = SixLabors.ImageSharp.Image.Load(imageStream))
                        using (MemoryStream pngStream = new MemoryStream())
                        {
                            await image.SaveAsPngAsync(pngStream);
                            pngStream.Position = 0;

                            _logger.LogInformation("PNG image saved successfully. Creating FormFile...");

                            var pngFileStream = new MemoryStream(pngStream.ToArray());
                            pngFileStream.Position = 0;

                            IFormFile formFile = new FormFile(pngFileStream, 0, pngFileStream.Length, "image", fileName)
                            {
                                Headers = new HeaderDictionary(),
                                ContentType = "image/png"
                            };

                            _logger.LogInformation("FormFile created successfully.");
                            return formFile;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while converting PDF to PNG. Exception: {ExceptionMessage}", ex.Message);
                throw;
            }
        }

        public IFormFile ConvertByteArrayToIFormFile(byte[] fileBytes, string fileName, string contentType)
        {
            if (fileBytes == null || fileBytes.Length == 0)
            {
                throw new ArgumentException("File data cannot be null or empty.");
            }

            var stream = new MemoryStream(fileBytes);
            return new FormFile(stream, 0, stream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }
    }
}