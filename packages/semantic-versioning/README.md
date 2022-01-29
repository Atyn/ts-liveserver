# About

Utility for sematic versioning

## Validate commits

```bash
semantic-versioning validate-commits --require-task-id --require-version-type
```

## Validate on git hook using husky

Create file ".huskyrc.json" with the following content:

```json
{
	"hooks": {
		"commit-msg": "semantic-versioning validate-commit",
		"prepare-commit-msg": "semantic-versioning prepare-commit-msg"
	}
}
```

## Get current latest release

```bash
semantic-versioning print-latest-version
```

## Get next version

```bash
semantic-versioning print-next-version
```

## Print release-notes

```bash
semantic-versioning print-release-notes
```

## Print version-type

```bash
semantic-versioning print-version-type
```

## Example git message

```
<TASK_ID>@<VERSION_TYPE>: <COMMIT_DESCRIPTION>
```
