using AutoMapper;
using Generator.API.DTO;

namespace Generator.API.Mappings;

public class FriendshipProfile : Profile 
{
    public FriendshipProfile()
    {
        CreateMap<Domain.Friendship, FriendshipDto>();
        CreateMap<FriendshipDto, Domain.Friendship>();
    }
}
