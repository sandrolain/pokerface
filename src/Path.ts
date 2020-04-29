
export type PathParams = Record<string, string>;
export type PathMatcherFunction = (path: string) => PathParams | false;
export type PathApplierFunction = (params: PathParams) => string;

export function getPathMatcher (matchPath: string): PathMatcherFunction {
  if(matchPath.indexOf(":") < 0) {
    return (path: string): PathParams | false => {
      return (path === matchPath) ? {} : false;
    };
  }

  const paramNames: string[] = [];

  const pathRegExpString = matchPath
    .replace(/:(\w+)/g, (m, paramName) => {
      paramNames.push(paramName);
      return "([^\\/]+)";
    }).replace(/\//g, "\\/");

  const pathRegExp = new RegExp(`^${pathRegExpString}$`);

  return (path: string): PathParams | false => {
    const match = path.match(pathRegExp);

    if(!match) {
      return false;
    }

    const result: PathParams = {};

    if(paramNames.length < 1) {
      return result;
    }

    match.shift();

    for(let i = 0, len = match.length; i < len; i++) {
      const  value = match[i];
      const  name  = paramNames[i];
      result[name] = value;
    }

    return result;
  };
}


export function getPathParamsApplier (matchPath: string): PathApplierFunction {
  if(!matchPath || (matchPath.indexOf(":") < 0 && matchPath.indexOf("*") < 0)) {
    return (): string => matchPath;
  }

  return (params: PathParams): string => {
    let result = matchPath;
    for(const name in params) {
      const value = params[name];
      if(name === "*") {
        result = result.replace(name, value);
      } else {
        const nameRegExp = new RegExp(`:${name}(/|$)`);
        result = result.replace(nameRegExp, `${value}$1`);
      }
    }
    return result;
  };
}
