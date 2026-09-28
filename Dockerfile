# Multi-stage production build for .NET 10 Clean Architecture API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project definition files for layer caching
COPY ["src/IpoBuddy.Domain/IpoBuddy.Domain.csproj", "src/IpoBuddy.Domain/"]
COPY ["src/IpoBuddy.Application/IpoBuddy.Application.csproj", "src/IpoBuddy.Application/"]
COPY ["src/IpoBuddy.Infrastructure/IpoBuddy.Infrastructure.csproj", "src/IpoBuddy.Infrastructure/"]
COPY ["src/IpoBuddy.Api/IpoBuddy.Api.csproj", "src/IpoBuddy.Api/"]

RUN dotnet restore "src/IpoBuddy.Api/IpoBuddy.Api.csproj"

# Copy full source and build
COPY src/ src/
WORKDIR "/src/src/IpoBuddy.Api"
RUN dotnet publish "IpoBuddy.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Production runtime container
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Environment configuration
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "IpoBuddy.Api.dll"]
