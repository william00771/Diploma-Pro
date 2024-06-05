using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Models;
using Backend.Services;
using AutoMapper;


namespace Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BootcampController : ControllerBase
{
    private readonly BootcampService _service;
    private readonly IMapper _mapper;

    public BootcampController(BootcampService service, IMapper mapper)
    {
        _service = service;
        _mapper = mapper;
    }

    // POST: api/Bootcamp
    [HttpPost]
    public async Task<ActionResult<BootcampResponseDto>> PostBootcamp(BootcampRequestDto requestDto)
    {
        try
        {
            var bootcamp = _mapper.Map<Bootcamp>(requestDto);
            await _service.PostBootcamp(bootcamp);
            var responseDto = _mapper.Map<BootcampResponseDto>(bootcamp);
            return CreatedAtAction(nameof(GetBootcamps), new { id = bootcamp.Id }, responseDto);
        }
        catch(ArgumentException)
        {
            return Conflict(new { message = "A bootcamp with the same name already exists." });
        }

    }


    // GET: api/Bootcamp
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Bootcamp>>> GetBootcamps()
    {
        return await _service.GetBootcamps();
    }

    // // GET: api/Bootcamp/5
    // [HttpGet("{id}")]
    // public async Task<ActionResult<Bootcamp>> GetBootcamp(int id)
    // {
    //     var bootcamp = await _context.Bootcamp.FindAsync(id);

    //     if (bootcamp == null)
    //     {
    //         return NotFound();
    //     }

    //     return bootcamp;
    // }

    // // PUT: api/Bootcamp/5
    // // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    // [HttpPut("{id}")]
    // public async Task<IActionResult> PutBootcamp(int id, Bootcamp bootcamp)
    // {
    //     if (id != bootcamp.Id)
    //     {
    //         return BadRequest();
    //     }

    //     _context.Entry(bootcamp).State = EntityState.Modified;

    //     try
    //     {
    //         await _context.SaveChangesAsync();
    //     }
    //     catch (DbUpdateConcurrencyException)
    //     {
    //         if (!BootcampExists(id))
    //         {
    //             return NotFound();
    //         }
    //         else
    //         {
    //             throw;
    //         }
    //     }

    //     return NoContent();
    // }

    // // DELETE: api/Bootcamp/5
    // [HttpDelete("{id}")]
    // public async Task<IActionResult> DeleteBootcamp(int id)
    // {
    //     var bootcamp = await _context.Bootcamp.FindAsync(id);
    //     if (bootcamp == null)
    //     {
    //         return NotFound();
    //     }

    //     _context.Bootcamp.Remove(bootcamp);
    //     await _context.SaveChangesAsync();

    //     return NoContent();
    // }

    // private bool BootcampExists(int id)
    // {
    //     return _context.Bootcamp.Any(e => e.Id == id);
    // }
}

