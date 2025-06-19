using AutoMapper;
using Generator.API.DTO;

namespace Generator.API.Mappings
{
    public class UserDataProfile : Profile
    {
        public UserDataProfile()
        {
            CreateMap<Domain.UserData, UserDataDto>();
            CreateMap<UserDataDto, Domain.UserData>();
        }
    }
}
