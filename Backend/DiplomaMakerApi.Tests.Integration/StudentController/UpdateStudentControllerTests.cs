using System.Net.Http.Headers;
using Xunit;

namespace DiplomaMakerApi.Tests.Integration.StudentController
{
    public class UpdateStudentControllerTests : IClassFixture<DiplomaMakerApiFactory>
    {
        private readonly HttpClient _client;
        public UpdateStudentControllerTests(DiplomaMakerApiFactory apiFactory)
        {
            _client = apiFactory.CreateClient();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("bearer", "test-token");
        }
    }
}