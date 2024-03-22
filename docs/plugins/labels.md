# Labels

> [!NOTE]
> Label color can start with `#`, e.g. `color: '#F341B2'`.

> [!IMPORTANT]
> If including the `#`, make sure to wrap it with quotes since it would otherwise be treated as a yaml comment!

```yaml
labels:
  - name: bug
    color: CC0000
    description: An issue with the system 🐛.

  - name: feature
    # If including a `#`, make sure to wrap it with quotes!
    color: '#336699'
    description: New functionality.

  - name: Help Wanted
    # Provide a new name to rename an existing label
    new_name: first-timers-only
```
