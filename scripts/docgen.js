const docgen = require("react-docgen-typescript");
const fs = require("fs-extra");

const quoteAngleBracket = (parsedString) => {
  let aBracketsRegEx = /(\<{1}.*>{1})/gm;
  let outString = parsedString.replace(aBracketsRegEx, "`$1`");
  return outString;
};

const escapeVerticalLines = (parsedString) => {
  return parsedString.replace(/\|/gm, "\\|");
};

const Comparator = (a, b) => {
  if (a[0].toLowerCase() < b[0].toLowerCase()) return -1;
  if (a[0].toLowerCase() > b[0].toLowerCase()) return 1;
  return 0;
};

const replaceUniCodeAtByLiteral = (string) => {
  return string.replace(/\&\#64\;/g, "@");
};

const addNewLineForComplexObject = (descrTag) => {
  let descTagNoWhiteSp = descrTag.replace(/\ /gm, "");
  const regExObj = /\{((((\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)|((\[\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)\](\?\:|\:)\w+)\;)+\}/g;
  let objMatches = [...descTagNoWhiteSp.matchAll(regExObj)];
  if (objMatches === null || objMatches === undefined) return descrTag;
  if (!objMatches[0]) return descrTag;
  let outStr = descTagNoWhiteSp.substr(0, objMatches[0].index);
  let lastObj = [];
  let iStartObjMatch;
  for (const objMatch of objMatches) {
    iStartObjMatch = objMatch.index;
    const propMatches = [
      ...objMatch[0].matchAll(
        /((((\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)|((\[\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)\](\?\:|\:)\w+)\;)/g
      ),
    ];
    if (propMatches !== null) {
      outStr += "{";
      for (const [ipropMatch, propMatch] of propMatches.entries()) {
        const pText = descTagNoWhiteSp.substr(iStartObjMatch + propMatch.index, propMatch[0].length);
        outStr += pText;
        if (propMatches.length > 1 && ipropMatch !== propMatches.length - 1) outStr += "<br/>";
      }
      outStr += "}";
    }
    lastObj = objMatch;
  }

  return outStr + descTagNoWhiteSp.substr(iStartObjMatch + lastObj[0].length);
};

const addNewLineForComplexFunctions = (typeTag) => {
  let typeTagNoWhiteSp = typeTag.replace(/\ /gm, "");
  const regExObj = /\(((((\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)|((\[\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)\](\?\:|\:)\w+)\,?)+\)/gm;
  let typeStrFuncMatches = [...typeTagNoWhiteSp.matchAll(regExObj)];
  if (typeStrFuncMatches === null || typeStrFuncMatches === undefined) return typeTag;
  if (!typeStrFuncMatches[0]) return typeTag;
  let outStr = typeTagNoWhiteSp.substr(0, typeStrFuncMatches[0].index);
  let lastMatch = [];
  let iStartTypeStrFuncMatch;
  for (const typeStrFuncMatch of typeStrFuncMatches) {
    iStartTypeStrFuncMatch = typeStrFuncMatch.index;
    const typeStrFuncParMatches = [
      ...typeStrFuncMatch[0].matchAll(
        /((((\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)|((\[\w+|\\?\"[\w\§\$\%\&\(\)\=\:\@\[\]]+\\?\")(\?\:|\:)\w+)\](\?\:|\:)\w+)\,?)\,?/gm
      ),
    ];
    if (typeStrFuncParMatches !== null) {
      outStr += "(";
      for (const [itypeStrFuncParMatch, typeStrFuncParMatch] of typeStrFuncParMatches.entries()) {
        const txt = typeTagNoWhiteSp.substr(
          iStartTypeStrFuncMatch + typeStrFuncParMatch.index,
          typeStrFuncParMatch[0].length
        );
        outStr += txt;
        if (typeStrFuncParMatches.length > 1 && itypeStrFuncParMatch !== typeStrFuncParMatches.length - 1)
          outStr += "<br/>";
      }
      outStr += ")";
    }
    lastMatch = typeStrFuncMatch;
  }

  return outStr + typeTagNoWhiteSp.substr(iStartTypeStrFuncMatch + lastMatch[0].length);
};

const getTagsObjFromFullComment = (fullcomment) => {
  let matches = fullcomment.match(/([^\\]@|^@)\w+/g);
  let iStartTag = 0;
  let lenTag = -1; // tags corrects space after tag
  let tags = {};
  let tagName = "desc";
  if (matches !== null)
    for (const match of matches) {
      let addNonBackslashChar = match.substr(0, 1) !== "@" ? 1 : 0;
      let iContentStart = iStartTag + lenTag + 1;
      iStartTag = fullcomment.indexOf(match, iContentStart);
      lenTag = match.length;
      let lenTagContent = iStartTag - iContentStart;
      let TagContent = fullcomment.substr(iContentStart, lenTagContent);
      tags[tagName] = TagContent;
      tagName = match.substr(1 + addNonBackslashChar);
    }
  let last = fullcomment.substr(iStartTag + lenTag + 1);
  tags[tagName] = last;

  return tags;
};

const options = {
  savePropValueAsString: true,
  shouldExtractValuesFromUnion: false,
  shouldIncludePropTagMap: true,
};

const parseDocument = (file) => {
  // Parse a file for docgen info
  const dg = docgen.parse(file, options);
  //console.log(dg);
  for (docElement of dg) {
    if ("docu" in docElement.tags) {
      let mdComponent = "";

      let elName = "Component name unknown";
      if ("displayName" in docElement) elName = docElement.displayName;
      else if ("description" in docElement) elName = docElement.description;
      else console.log("WARNING: element's displayname or description not found.", docElement);
      let elRemark = "";
      if ("tags" in docElement) {
        if ("dummy" in docElement.tags) {
          if (typeof docElement.tags.dummy === "string") {
            if (docElement.tags.dummy.trim().length > 0) elName = docElement.tags.dummy.trim();
          }
        }
        if ("remark" in docElement.tags) {
          elRemark = quoteAngleBracket(docElement.tags.remark) + "\r\n"; // no additional backslash before \r\n needed
        }
      }
      mdComponent += "# `<" + quoteAngleBracket(elName) + " />`\r\n" + elRemark;

      let PropTupleArray = {};
      let mdPropTable = "";
      let mdPropDetails = "";
      if ("props" in docElement) {
        if (Object.keys(docElement.props).length >= 1) {
          PropTupleArray = Object.entries(docElement.props).sort(Comparator);
          mdPropTable += "| Name        | Type           | Default  | Required  | Description  |" + "\r\n";
          mdPropTable += "| :------------- |:-------------| :-----:| :-----:|:-------------:| " + "\r\n";
        }

        for (const [propKey, propVal] of PropTupleArray) {
          if (propVal === null) continue;

          let prop_DefaultValue = "";
          if ("defaultValue" in propVal)
            if (propVal.defaultValue !== null)
              if ("value" in propVal.defaultValue) prop_DefaultValue = propVal.defaultValue.value;

          let prop_Type = "";
          if ("type" in propVal)
            if (propVal.type !== null)
              if ("name" in propVal.type)
                prop_Type = addNewLineForComplexFunctions(addNewLineForComplexObject(propVal.type.name));

          let propRequired = "";
          let propRequiredTag = "";
          if ("required" in propVal)
            if (propVal.required === true) {
              propRequired = "✔️";
              propRequiredTag = "  \\<`Required`\\>";
            }

          const propCustomObj = getTagsObjFromFullComment(propVal.description);

          let isInternal = false;
          let useDescTagAsDescription = false;
          let propFullDescription = "";
          let propShortDescription = "";
          let propTags = {};
          propTags = propCustomObj; //propVal.tags;

          if ("internal" in propTags) isInternal = true;
          if ("nospec" in propTags) {
            prop_DefaultValue = "```TODO 🚧 ```";
            prop_Type = "```TODO 🚧```";
          }
          if ("desc" in propTags)
            if (typeof propTags.desc === "string") if (propTags.desc.length > 0) useDescTagAsDescription = true;

          if (useDescTagAsDescription) {
            propShortDescription = replaceUniCodeAtByLiteral(propTags.desc);
            propFullDescription = propShortDescription + "\r\n";
            if ("remark" in propTags)
              if (typeof propTags.remark === "string")
                if (propTags.remark.length > 0)
                  propFullDescription =
                    propShortDescription + "\\\r\n" + replaceUniCodeAtByLiteral(propTags.remark) + "\r\n"; // md needs \CRLF for newline?
          } else if ("description" in propVal)
            if (propVal.description !== null)
              propFullDescription = replaceUniCodeAtByLiteral(propVal.description) + "\r\n";

          if (!isInternal) {
            let propName = escapeVerticalLines(quoteAngleBracket(propKey));
            mdPropTable += `| [${propName}](#${propName}) | ${escapeVerticalLines(prop_Type)} | ${escapeVerticalLines(
              prop_DefaultValue
            )} | ${propRequired} | ${escapeVerticalLines(propShortDescription)} |\r\n`;
            mdPropDetails +=
              "### \\(`" + quoteAngleBracket(propKey) + "`\\)" + propRequiredTag + " \r\n" + propFullDescription;
          }
        }
      }
      console.log("found something to doc");
      const filename = file.substr(0, file.lastIndexOf(".")).substr(dirSrc.length + 1);
      fs.outputFile(`./docs/${filename}.md`, mdComponent + "\r\n" + mdPropTable + "\r\n" + mdPropDetails, {
        flags: "w+",
      });

      var cache = [];
      var mstring = JSON.stringify(dg, (key, val) => {
        if (typeof val === "object" && val !== null) {
          // Duplicate reference found, discard key
          if (cache.includes(val)) return;
          // Store value in our collection
          cache.push(val);
        }
        return val;
      });
      //fs.promises.writeFile(`./docs/json/ctable.json`, mstring);
      fs.outputFile(`./docs/json/${filename}.json`, mstring);
      cache = null;
    }
  }
};

const dirSrc = "src";
const dirDocs = "docs";

const loopDocs = (dir, dest) => {
  const dirFiles = fs.readdirSync(dir);
  for (dirFile of dirFiles) {
    const isFolder = fs.lstatSync(dir + "/" + dirFile).isDirectory();
    const posDotFileExtension = dirFile.lastIndexOf(".");
    const fileExt = dirFile.substr(posDotFileExtension);
    const isDeclaration = dirFile.substr(posDotFileExtension - 2) === ".d.ts";
    if (isFolder) loopDocs(dir + "/" + dirFile, dest);
    else if ((fileExt === ".tsx" || fileExt === ".ts") && !isDeclaration) {
      parseDocument(dir + "/" + dirFile);
    }
  }
};

const cliArgs = process.argv.slice(2, 3);
if (cliArgs.length === 0) {
  // no cli arg provided
  console.log("no argument >filename< provided.\nAll files in src are parsed instead.");
  loopDocs(dirSrc, dirDocs);
} else {
  if (!fs.existsSync(cliArgs[0])) {
    console.log("provided file doesn't exist.", cliArgs[0]);
    process.exit();
  }
  console.log("argument >filename< provided.\nfile " + cliArgs[0] + " is checked");
  const fileExt = cliArgs[0].substr(cliArgs[0].lastIndexOf("."));
  if (fileExt !== ".tsx" && fileExt !== ".ts") {
    console.log("provided file is not a .ts or .tsx file", cliArgs[0]);
    process.exit();
  }
  parseDocument(cliArgs[0]);
}
