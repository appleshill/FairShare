import glpk from 'glpk.js';

const solveDebtsLP = (D) => {
  const size = D.length;
  let lp = new glpk.Problem();
  lp.setObjDir(glpk.MIN);


  let variables = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i !== j) {
        let id = `x_${i}_${j}`;
        let varInfo = lp.addVariable(id, 0, 1, glpk.CONT);
        variables.push({ id, i, j, varInfo });
      }
    }
  }

  variables.forEach(({ id }) => {
    lp.setObjectiveCoefficient(id, 1);
  });


  for (let i = 0; i < size; i++) {
    let row = lp.addRow(`net_flow_${i}`, glpk.FX, 0); 
    variables.forEach(({ id, i: vi, j: vj }) => {
      lp.setRowCoefficient(row, id, (vi === i ? -1 : 0) + (vj === i ? 1 : 0));
    });
  }

  // Solve the problem
  lp.solve();
  let status = lp.getStatus();
  
  if (status === glpk.OPT) {
    let result = variables.map(v => ({
      from: v.i,
      to: v.j,
      amount: lp.getVariablePrim(v.varInfo)
    })).filter(v => v.amount > 0);
    
    console.log('Optimal solution found:', result);
    return result;
  } else {
    console.log('No solution found.');
    return [];
  }
};

export default solveDebtsLP;
