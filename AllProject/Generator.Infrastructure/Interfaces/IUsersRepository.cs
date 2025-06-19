using Generator.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Generator.Infrastructure.Interfaces;

public interface IUsersRepository
{
    void Add(Users user);
    Users GetByUsername(string username);
    Users GetById(int id); 
    IEnumerable<Users> GetAll(); 
    bool UserExists(string username);
}
