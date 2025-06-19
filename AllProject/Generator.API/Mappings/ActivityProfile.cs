using AutoMapper;
using Generator.API.DTO;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Generator.API.Mappings

{
    public class ActivityProfile : Profile
    {
        public ActivityProfile()
        {
            CreateMap<Domain.Activities, ActivityDto>();
            CreateMap<ActivityDto, Domain.Activities>();
        }
    }
}
