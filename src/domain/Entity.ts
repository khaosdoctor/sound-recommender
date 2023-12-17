import { ObjectId } from 'mongodb'

/**
 * In TypeScript, interfaces have both the static side as well as the instance side.
 * When you define a static property or method, and you want to make sure that the
 * class follows that pattern, you need to create an interface that represents the static side.
 * then you can use that interface to type the class.
 * @see https://dev.to/_staticvoid/defining-static-methods-in-interfaces-with-typescript-4232
 */
export interface StaticEntity {
  new (...args: any[]): any
  collectionName: string
}

// Type to get only the properties of a class that are not methods
export type OnlyProps<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends Function ? never : K
  }[keyof T]
>

/**
 * Abstract classes such as this one cannot be instantiated directly
 * but can infer all the types from the class that extends it
 * and type its methods to be the same as the ones in the extending class
 */
export abstract class Entity<ClassConstructor extends StaticEntity, ClassInstance = InstanceType<ClassConstructor>> {
  id: string
  #_id: ObjectId

  constructor(id: string) {
    this.id = id
    this.#_id = new ObjectId(id)
  }

  toDocument() {
    return {
      ...this.toObject(),
      _id: this.#_id
    }
  }

  toObject() {
    return Object.entries(this).reduce<OnlyProps<ClassInstance>>((obj: any, [key, value]) => {
      obj[key] = value
      return obj
    }, {} as OnlyProps<ClassInstance>)
  }
}
