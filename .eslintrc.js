module.exports = {
    "extends": "airbnb",
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
        "jest": true
    },
    "parser": "babel-eslint",
    "rules": {
            "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
            "jsx-a11y/label-has-for": [ 2, {
            "required": {
                "some": [ "nesting", "id" ]
            },
            "allowChildren": false
        }],
    "jsx-a11y/anchor-is-valid": [ "error", {
            "components": [ "Link" ],
            "specialLink": [ "to" ]
        }],
        "react/forbid-prop-types": 0,
        "import/no-extraneous-dependencies": 0,
        "no-underscore-dangle": [2, { "allowAfterThis": true }],
        "react/no-multi-comp": [false, { "ignoreStateless": true }]
    }
}
