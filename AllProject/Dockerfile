# Используем официальный образ для .NET SDK
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

# Используем официальный образ для .NET SDK для сборки проекта
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Generator.API/Generator.API.csproj", "Generator.API/"]
RUN dotnet restore "Generator.API/Generator.API.csproj"
COPY . .
WORKDIR "/src/Generator.API"
RUN dotnet build "Generator.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Generator.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Generator.API.dll"]
