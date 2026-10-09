// Optional signing configuration for electron-builder 26.x.
// Account provisioning and identity validation must be completed first.
const base = require('./package.json').build;
function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing signing setting: ${name}`);
  return value;
}
const endpoint = required('ATELIER_SIGNING_ENDPOINT');
if (!/^https:\/\/[a-z0-9-]+\.codesigning\.azure\.net\/?$/.test(endpoint)) throw new Error('Invalid Azure signing endpoint.');
module.exports = {
  ...base,
  forceCodeSigning: true,
  directories: {...base.directories, output: 'release-signed'},
  win: {
    ...base.win,
    signAndEditExecutable: true,
    azureSignOptions: {
      publisherName: required('ATELIER_SIGNING_PUBLISHER'),
      endpoint,
      codeSigningAccountName: required('ATELIER_SIGNING_ACCOUNT'),
      certificateProfileName: required('ATELIER_SIGNING_PROFILE'),
      fileDigest: 'SHA256',
      timestampDigest: 'SHA256',
      timestampRfc3161: 'http://timestamp.acs.microsoft.com',
    },
  },
};
