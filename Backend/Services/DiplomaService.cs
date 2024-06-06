using Microsoft.EntityFrameworkCore;
using Backend.Models;
using AutoMapper;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Backend.Services;

public class DiplomaService
{
    private readonly DiplomaMakingContext _context;


    public DiplomaService(DiplomaMakingContext context)
    {
        _context = context;
    }

    public async Task<Diploma> PostDiploma(DiplomaRequestDto requestDto)
    {

        var bootcamp = await _context.Bootcamp
            .FirstOrDefaultAsync(b => b.GuidId.ToString() == requestDto.BootcampGuidId)
            ?? throw new BootcampNotFoundException("Bootcamp you are trying to add this diploma to, does not exist");
        
        var existingDiploma = await _context.Diploma
            .FirstOrDefaultAsync(d => d.StudentName == requestDto.StudentName
            && d.Bootcamp.GuidId == bootcamp.GuidId);
        if (existingDiploma != null)
            throw new DiplomaExistsException("This student has already earned a diploma in this bootcamp");

        var diploma = new Diploma
        { 
            StudentName = requestDto.StudentName, 
            GraduationDate = requestDto.GraduationDate,
            Bootcamp = bootcamp 
        };
        _context.Diploma.Add(diploma);
        await _context.SaveChangesAsync();

        return diploma;
    }

    public async Task<List<Diploma>> GetDiplomas(){
        return await _context.Diploma
            .Include(d => d.Bootcamp)
            .ToListAsync();

    }

    // public async Task<List<Diploma>> GetBootcamps()
    // {
    //     return await _context.Diploma
    //         .Include(b => b.Diplomas)
    //         .ToListAsync();
    // }
    // public async Task<Diploma> DeleteBootcampByGuidId(string guidId)
    // {
    //     var bootcamp = await _context.Diploma.
    //         FirstOrDefaultAsync(b => b.GuidId.ToString() == guidId);

    //     _ = _context.Diploma.Remove(bootcamp);
    //     await _context.SaveChangesAsync();
    //     return bootcamp;
    // }
}

public class BootcampNotFoundException : Exception
{
    public BootcampNotFoundException(string message) : base(message) { }
}

public class DiplomaExistsException : Exception
{
    public DiplomaExistsException(string message) : base(message) { }
}