let inquirer: any;

async function getInquirer(): Promise<any> {
  if (!inquirer) {
    const mod = await import("inquirer");
    inquirer = mod.default ?? mod;
  }
  return inquirer;
}

export async function promptInput(message: string, defaultValue?: string, mask?: boolean): Promise<string> {
  const iq = await getInquirer();
  const answer = await iq.prompt({
    type: "input",
    name: "value",
    message,
    default: defaultValue,
    mask,
  });
  return answer.value as string;
}

export async function promptPassword(message: string): Promise<string> {
  const iq = await getInquirer();
  const answer = await iq.prompt({
    type: "password",
    name: "value",
    message,
    mask: "*",
  });
  return answer.value as string;
}

export async function promptConfirm(message: string, defaultValue = true): Promise<boolean> {
  const iq = await getInquirer();
  const answer = await iq.prompt({
    type: "confirm",
    name: "value",
    message,
    default: defaultValue,
  });
  return answer.value as boolean;
}

export async function promptList<T extends string>(message: string, choices: T[]): Promise<T> {
  const iq = await getInquirer();
  const answer = await iq.prompt({
    type: "list",
    name: "value",
    message,
    choices,
  });
  return answer.value as T;
}
