using Xunit;

// Disable parallel test execution so integration tests using SQLite don't race on startup
[assembly: CollectionBehavior(DisableTestParallelization = true)]
