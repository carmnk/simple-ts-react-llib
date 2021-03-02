const fs = require("fs-extra");

const dirDist = "dist"; // script shall only be executed from pkg root folderd
const dirSrc = "src";

// check if dir exists
if (fs.existsSync(dirDist)) {
  fs.rmdirSync(dirDist, { recursive: true });
}
fs.mkdirSync(dirDist);

const CopySrcPkgs = (dir, dest) => {
  const dirFiles = fs.readdirSync(dir);
  for (dirFile of dirFiles) {
    const isFolder = fs.lstatSync(dir + "/" + dirFile).isDirectory();
    if (isFolder) CopySrcPkgs(dir + "/" + dirFile, dest);
    else if (dirFile === "package.json")
      fs.copy(dir + "/" + dirFile, dest + "/" + dir.substr(dirSrc.length) + "/" + "package.json");
  }
};

// Copy Packages in Src Folder
CopySrcPkgs(dirSrc, dirDist);

// Copy Root Package Files
const rtFiles = ["package.json", "README.md", "LICENSE"];
for (const rtFile of rtFiles) fs.copy(rtFile, dirDist + "/" + rtFile);
