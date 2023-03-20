### Release Instructions (for project committers)

* Update the `version` field in `package.json` to the version you want to cut.
* Commit: `git commit -s -S -m "Release <version>."`
* Create the git tag: `git tag -a -s -m "Release <version>." <version>`
* Push commit and tag: `git push --follow-tags`
* Publish to NPM: `npm publish`
