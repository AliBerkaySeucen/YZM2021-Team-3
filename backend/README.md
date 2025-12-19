## Testing

Run tests from the `backend/` directory:

```bash
pytest
```

### Environment variables

Tests stub out Supabase access, but some endpoints still rely on auth settings. Set these as
needed for token-related tests:

* `SECRET_KEY`
* `ALGORITHM`
* `ACCESS_TOKEN_EXPIRE_MINUTES`

Supabase configuration (`SUPABASE_URL`, `SUPABASE_KEY`) is provided with test defaults in
`backend/tests/conftest.py` and can be overridden locally if desired.
