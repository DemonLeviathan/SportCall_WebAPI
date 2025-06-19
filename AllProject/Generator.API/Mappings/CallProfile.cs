using AutoMapper;
using Generator.API.DTO;

namespace Generator.API.Mappings;

public class CallProfile : Profile
{
    public CallProfile()
    {
        CreateMap<Domain.Calls, CallsDto>();
        CreateMap<CallsDto, Domain.Calls>();
    }
}
