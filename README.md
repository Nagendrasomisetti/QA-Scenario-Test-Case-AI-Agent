# QA Scenario & Test Case AI Agent

## LLM Provider Configuration

This application supports multiple AI providers for generating QA requirements, test cases, risks, and missing requirements. The providers are configured using environment variables without requiring any code changes.

### Available Providers
- `gemini` (Google Gemini)
- `bluesminds` (OpenAI-compatible endpoints, e.g. DeepSeek via BluesMinds)

### Environment Variables

To configure the provider, set the `LLM_PROVIDER_CHAIN` in your backend `.env` file or hosting provider dashboard (e.g. Render).

```env
# Define the order of providers to try sequentially. 
# If a provider fails (e.g. rate limit, unsupported feature), it will fall back to the next.
LLM_PROVIDER_CHAIN=bluesminds,gemini

# BluesMinds Configuration (Only needed if bluesminds is in the chain)
LLM_API_KEY=your_llm_api_key
LLM_BASE_URL=https://api.bluesminds.com/v1
LLM_MODEL_NAME=accounts/fireworks/models/deepseek-v4-pro

# Gemini Configuration (Only needed if gemini is in the chain)
GEMINI_API_KEY=your_gemini_api_key
```

### Extensibility

The system uses a configurable provider chain abstraction. To add new providers (like Groq, Together AI, or Anthropic):
1. Create a new service in `backend/app/services` inheriting from `BaseLLMAnalyzer`.
2. Add the provider mapping in `backend/app/services/analyzer_factory.py`.
3. Update the `LLM_PROVIDER_CHAIN` environment variable.

### Deployment (Render)

Ensure you add the new environment variables to your Render dashboard:
- `LLM_PROVIDER_CHAIN`
- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL_NAME`
- `GEMINI_API_KEY`
