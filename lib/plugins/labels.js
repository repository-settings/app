const Diffable = require('./diffable');

module.exports = class Labels extends Diffable {
  constructor(...args) {
    super(...args);

    if (this.entries) {
      this.entries.forEach(label => {
        // Force color to string since some hex colors can be numerical (e.g. 999999)
        label.color = String(label.color);
      });
    }
  }

  find() {
    return this.github.issues.getLabels(this.repo).then(res => res.data);
  }

  comparator(existing, attrs) {
    return existing.name === attrs.name || existing.name === attrs.oldname;
  }

  changed(existing, attrs) {
    return attrs.oldname === existing.name || existing.color !== attrs.color;
  }

  update(existing, attrs) {
    attrs.oldname = attrs.oldname || attrs.name;
    return this.github.issues.updateLabel(Object.assign({}, attrs, this.repo));
  }

  add(attrs) {
    return this.github.issues.createLabel(Object.assign({}, attrs, this.repo));
  }

  remove(existing) {
    return this.github.issues.deleteLabel(
      Object.assign({}, {name: existing.name}, this.repo)
    );
  }
};
