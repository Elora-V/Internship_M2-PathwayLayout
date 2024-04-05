import libsbml from 'libsbmljs_stable';

export async function sbml2json(filename: string){
    // console.log('test');
    // console.log(libsbml());
    // libsbml().then((libsbml) => {
    //     // now it is safe to use the module
    //     const doc = new libsbml.SBMLDocument(3,2)
    //   })

    new Promise (() => {
        return libsbml();
    }).then(() => {
        const doc = new libsbml.SBMLDocument(3,2);
    });
}