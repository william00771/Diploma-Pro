using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Bogus;
using DiplomaMakerApi.Models;
using FluentAssertions;
using Xunit;

namespace DiplomaMakerApi.Tests.Integration.TemplatesController
{
    public class DeleteTemplatesControllerTests : IClassFixture<DiplomaMakerApiFactory>
    {
        private readonly HttpClient _client;
        private readonly Faker<TemplatePostRequestDto> _templateRequestGenerator =
            new Faker<TemplatePostRequestDto>()
                .RuleFor(x => x.templateName, faker => Path.GetFileNameWithoutExtension(faker.System.FileName()));
        public DeleteTemplatesControllerTests(DiplomaMakerApiFactory apiFactory)
        {
            _client = apiFactory.CreateClient();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "test-token");
        }

        [Fact]
        public async void DeleteTemplate_ReturnsNoContent_WhenValidRequest()
        {
            // Arrange
            var initTemplateRequest = _templateRequestGenerator.Generate();
            var initResponse = await _client.PostAsJsonAsync("api/Templates", initTemplateRequest);
            var initTemplateResponse = await initResponse.Content.ReadFromJsonAsync<TemplateResponseDto>();
            var initTemplateResponseId = initTemplateResponse!.Id;
            // Act
            var response = await _client.DeleteAsync($"api/Templates/{initTemplateResponseId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            TestUtil.CheckFileDoesNotExist(initTemplateRequest.templateName, ".pdf", "DiplomaPdfs");
        }
    }
}