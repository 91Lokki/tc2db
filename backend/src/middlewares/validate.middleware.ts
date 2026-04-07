import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodEffects } from "zod";

type SchemaShape = {
  body?: AnyZodObject | ZodEffects<AnyZodObject>;
  query?: AnyZodObject | ZodEffects<AnyZodObject>;
  params?: AnyZodObject | ZodEffects<AnyZodObject>;
};

export function validate(schemas: SchemaShape) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as Request["body"];
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
