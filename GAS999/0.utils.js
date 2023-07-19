function _updateDocWithPlaceholders_(id, item) {
  const doc = DocumentApp.openById(id);
  const body = doc.getBody();
  Object.entries(item).forEach(([key, value]) => {
    body.replaceText(new RegExp(`{%\s*${key}\s*%}`, "g"), value);
  });
  doc.saveAndClose();
}

function _updateExpression_(expression, item) {
  Object.entries(item).forEach(([key, value]) => {
    if (typeof value === "string") {
      value = `"${value}"`;
    }
    expression = expression.replace(new RegExp(`${key}`, "g"), value);
  });
  return expression;
}

function _isConditionValid_(expresion, item) {
  if (expresion == "") return false;
  const updatedExpression = _updateExpression_(expresion, item);
  console.log({ expresion, updatedExpression });
  return eval(updatedExpression);
}

/**
 * @param {string} text
 */
function _getConditionBlocks_(text, item) {
  let data = [];
  const regexIf = /{%\s*if\s*([^{}%]+)\s*%}/gim;
  const regexElseIf = /{%\s*else\s*if\s*([^{}%]+)\s*%}/gim;
  const regexElse = /{%\s*else\s*([^{}%]+)\s*%}/gim;
  const regexEndIf = /{%\s*end\s*if\s*([^{}%]+)\s*%}/gim;
  [regexIf, regexElseIf, regexElse, regexEndIf].forEach((regex) => {
    const matches = [...text.matchAll(regex)].map(
      ([match, expression, index]) => {
        expression = expression.trim();
        return {
          match,
          result: _isConditionValid_(expression, item),
          index,
        };
      }
    );
    data = [...date, ...matches];
  });
  return data;
}

function _parseDoc_(id, item) {
  const doc = DocumentApp.openById(id);
  const body = doc.getBody();
  const text = body.getText();
  const regexIf = /{%\s*if\s*([^{}%]+)\s*%}/gim;
  const regexEndIf = /{%\s*end\s*if\s*([^{}%]+)\s*%}/gim;

  if (regexIf.test(text) == false || regexEndIf.test(text) == false) {
    _updateDocWithPlaceholders_(id, item);
    return;
  }
  const blocks = _getConditionBlocks_(text, item);
}

function _updateTextWithPlaceholders_(text, item) {
  Object.entries(item).forEach(([key, value]) => {
    text = text.replace(new RegExp(`${key}`, "g"), value);
  });
  return text;
}

function testBlock() {
  const idOfDocTemplate = "1nWR34UEVUkWm8gJEA0A17VZMhRh61Y4FIVlD6Tveoj8";
  const placeholders = {
    gender: "Male",
    name: "Ashton Fei",
  };
  const text = DocumentApp.openById(idOfDocTemplate).getBody().getText();
  const blocks = _getConditionBlocks_(text, placeholders);
  console.log(blocks);
}

function test() {
  const idOfDocTemplate = "1nWR34UEVUkWm8gJEA0A17VZMhRh61Y4FIVlD6Tveoj8";
  const placeholders = {
    gender: "Male",
    name: "Ashton Fei",
  };
  const template = DriveApp.getFileById(idOfDocTemplate);
  const name = _updateTextWithPlaceholders_(template.getName(), placeholders);
  const copyOfTemplate = template.makeCopy(name, destination);
  const idOfCopy = copyOfTemplate.getId();
  _parseDoc_(idOfCopy, item);
}
