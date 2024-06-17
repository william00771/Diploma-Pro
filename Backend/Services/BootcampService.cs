    using Microsoft.EntityFrameworkCore;
    using Backend.Models;
    using AutoMapper;
    using Microsoft.EntityFrameworkCore.Diagnostics;

    namespace Backend.Services;

    public class BootcampService
    {
        private readonly DiplomaMakingContext _context;

        public BootcampService(DiplomaMakingContext context)
        {
            _context = context;
        }

        public async Task<Bootcamp> PostBootcamp(Bootcamp bootcamp)
        {
            _context.Bootcamp.Add(bootcamp);
            await _context.SaveChangesAsync();
            return bootcamp;
        }

        public async Task<List<Bootcamp>> GetBootcamps() =>
                await _context.Bootcamp
                .Include(b => b.Diplomas)
                .ToListAsync();

        public async Task<Bootcamp?> GetBootcampByGuidId(Guid guidId) => 
                await _context.Bootcamp
                .Include(b => b.Diplomas)
                .FirstOrDefaultAsync(b => b.GuidId == guidId);

    public async Task<Bootcamp> DeleteBootcampByGuidId(Guid guidId)
    {
        var bootcamp = await _context.Bootcamp.FirstOrDefaultAsync(b => b.GuidId == guidId);
        if (bootcamp == null)
        {
            throw new ArgumentException("The specifc ID for Bootcamp does not exist");
        }
        _context.Remove(bootcamp);
        await _context.SaveChangesAsync();

        return bootcamp;
    }


    public async Task<Bootcamp> PutBootcampAsync(Guid GuidID, BootcampRequestDto requestDto) 
    {
        try
        {
            var bootcamp = await _context.Bootcamp
                .FirstOrDefaultAsync(b => b.GuidId == GuidID) ?? throw new ArgumentException("The specifc ID for Bootcamp does not exist");

            bootcamp.Name = requestDto.Name;
            bootcamp.CourseDate = requestDto.CourseDate;
    
           await _context.SaveChangesAsync();
           return bootcamp;
        }
        catch (DbUpdateException ex)
        {
            throw new DbUpdateException("Failed to save changes Bootcamp name needs to be unique");
        }
   
    }


    }