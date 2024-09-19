using System.Net.Http.Headers;
using Xunit;

namespace DiplomaMakerApi.Tests.Integration.BlobController
{
    public class GetPdfBlobControllerTests : IClassFixture<DiplomaMakerApiFactory>
    {
        private readonly HttpClient _client;
        public GetPdfBlobControllerTests(DiplomaMakerApiFactory apiFactory)
        {
            _client = apiFactory.CreateClient();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("bearer", "test-token");
        }

        // [Fact]
        // public async Task GetFile_ReturnsFile_WhenFileExists()
        // {

        // }
    }
}