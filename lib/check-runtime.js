var name, unsupportedFeatures = [];
var features = {
    class: works('class A {}'),
    arrowFunction: works('() => {}'),
    let: works('let x'),
    const: works('const x = 1'),
    destructuring: works('var {x} = {x:1}'),
    defaultParamValues: works('function a (a=1) {}'),
    promises: works('Promise.resolve().then()'),
    templateLiterals: works('var x=1; `${x}`'),
};

function works (code)
{
    try
    {
        eval(code);
        return true;
    }
    catch (error)
    {
        return false;
    }
}

for (name in features)
{
    if (features.hasOwnProperty(name))
    {
        if (! features[name])
        {
            unsupportedFeatures.push(name);
        }
    }
}

if (unsupportedFeatures.length)
{
    throw new Error('Runtime does not support these required EcmaScript features: ' + unsupportedFeatures.join(', '));
}
