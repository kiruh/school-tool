const { db } = require("../connections");

// helpers
const snapToArray = snapshot => {
  if (snapshot.empty) return [];
  const arr = [];
  const docs = snapshot.docs || [snapshot];
  docs.forEach(doc => {
    arr.push(doc);
  });
  return arr;
};
const parseDoc = doc => {
  return {
    id: doc.id,
    ...doc.data()
  };
};

class Base {
  constructor(props = {}) {
    Object.assign(this, props);
  }

  json() {
    return { ...this };
  }

  static parseSnap(snapshot) {
    return snapToArray(snapshot)
      .map(parseDoc)
      .map(obj => new this(obj));
  }

  static async getAll() {
    try {
      const snapshot = await db.collection(this.collection).get();
      const objs = this.parseSnap(snapshot);
      return objs;
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  static async filter(...filters) {
    try {
      let ref = db.collection(this.collection);
      filters.forEach(filter => {
        ref = ref.where(...filter);
      });
      const snapshot = await ref.get();
      return this.parseSnap(snapshot);
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  static async get(id) {
    try {
      const snapshot = await db
        .collection(this.collection)
        .doc(id)
        .get();
      const objs = this.parseSnap(snapshot);
      return objs[0];
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  static async create(obj) {
    this.validate(obj);
    try {
      const ref = await db.collection(this.collection).add({ ...obj });
      return new this({ id: ref.id, ...obj });
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  static async update(obj) {
    this.validate(obj);
    try {
      await db
        .collection(this.collection)
        .doc(obj.id)
        .set({ ...obj });
      return obj;
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  static async save(obj) {
    const { id } = obj;
    let existing = await this.get(id);
    if (existing) {
      existing = new this({
        ...existing,
        ...obj
      });
      return await this.update(existing);
    } else {
      return await this.create(obj);
    }
  }

  static async delete(obj) {
    try {
      await db
        .collection(this.collection)
        .doc(obj.id)
        .delete();
      return true;
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  static validate(obj) {
    const errors = [];
    if (errors.length) {
      throw new Error(`Invalid obj (${errors.join(", ")})`);
    }
  }
}
// override collection in children
Base.collection = undefined;

module.exports = Base;
