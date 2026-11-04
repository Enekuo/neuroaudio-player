import { analizarTexto, partesEnLinea } from './formato'

/** Una línea con **negrita**, siempre como texto (nunca HTML). */
function Linea({ texto }: { texto: string }) {
  return (
    <>
      {partesEnLinea(texto).map((p, i) =>
        p.negrita ? <strong key={i}>{p.texto}</strong> : p.texto,
      )}
    </>
  )
}

/** Pinta un texto legal (formato de formato.ts) con títulos, listas y tablas. */
function TextoLegal({ texto }: { texto: string }) {
  return (
    <div className="na-legal__cuerpo">
      {analizarTexto(texto).map((bloque, i) => {
        switch (bloque.tipo) {
          case 'titulo':
            return (
              <h2 key={i}>
                <Linea texto={bloque.texto} />
              </h2>
            )
          case 'parrafo':
            return (
              <p key={i}>
                <Linea texto={bloque.texto} />
              </p>
            )
          case 'lista': {
            const Etiqueta = bloque.numerada ? 'ol' : 'ul'
            return (
              <Etiqueta key={i}>
                {bloque.elementos.map((e, j) => (
                  <li key={j}>
                    <Linea texto={e} />
                  </li>
                ))}
              </Etiqueta>
            )
          }
          case 'tabla':
            return (
              <div key={i} className="na-legal__tabla">
                <table>
                  <thead>
                    <tr>
                      {bloque.cabecera.map((c, j) => (
                        <th key={j} scope="col">
                          <Linea texto={c} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bloque.filas.map((fila, j) => (
                      <tr key={j}>
                        {fila.map((c, k) => (
                          <td key={k}>
                            <Linea texto={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      })}
    </div>
  )
}

export default TextoLegal
