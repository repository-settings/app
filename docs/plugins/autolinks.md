# Autolinks

https://docs.github.com/en/rest/repos/autolinks

```yaml
autolinks:
  # The prefix that identifies a reference in issues, pull requests, commit messages, and elsewhere
  - key_prefix: 'ABC-'
    # The target URL. Must contain `<num>`, which is replaced by the reference identifier
    url_template: 'https://example.com/browse/ABC-<num>'
    # Whether the reference identifier is alphanumeric. When `false`, only numeric identifiers match.
    # Optional, defaults to `true`
    is_alphanumeric: false
  - key_prefix: 'PROJ-'
    url_template: 'https://jira.example.com/browse/PROJ-<num>'
```

The autolinks API provides no endpoint for updating an existing autolink, and an autolink is identified by its
`key_prefix`. Changing the `url_template` or `is_alphanumeric` of an existing entry therefore results in the autolink
being deleted and recreated.
