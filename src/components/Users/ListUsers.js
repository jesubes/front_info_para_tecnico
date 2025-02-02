
import React, { useState, useMemo } from 'react'
import { reportByNumber } from '../../api/report.api';
import {
    Button,
    Checkbox,
    Icon,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Dropdown
} from 'semantic-ui-react';

export const ListUsers = (props) => {

    //saco jsonData, no tengo almacenes ni proceso de imagenes
    // const { jsonData, jsonDataContact } = props;
   
   
    const { jsonDataContact } = props;
    //pasar el valor del check a true en todos los documentos del jsonDataContact
    
    
    //Inicializar datos con campos adicionales
    const addCheckContact = useMemo(
        () => jsonDataContact.map(item => ({
            ...item,
            checkToSend: true,
            isSend: false,
        })),
        [jsonDataContact]
    )


    const [dataSelect, setDataSelect] = useState(addCheckContact)
    const [buttonDisableReport, setButtonDisableReport] = useState(false)
    const [selectedSupervisor, setSelectedSupervisor] = useState(null)
    const [allChecked, setAllChecked] = useState(true);

    //obtener lista unica de supervisores
    const supervisors = useMemo(
        () =>
            [...new Set(addCheckContact.map(contact => contact.Supervisor))].map(supervisor => ({
                key: supervisor,
                text: supervisor,
                value: supervisor,
            })),
        [addCheckContact]
    )

    //manejar los check 
    // El problema radica en cómo estamos manejando los índices en la función handleCheckboxChange. 
    // Al filtrar los contactos, los índices de la lista filtrada no coinciden con los índices originales en dataSelect.
    //  Esto provoca que se actualicen los datos incorrectos en dataSelect.
    // Para solucionar este problema, necesitamos identificar de manera única cada contacto (por ejemplo, usando un identificador único como Numero) 
    // en lugar de confiar en los índices de la lista filtrada.
    const handleCheckboxChange = (Telefono) => {
        setDataSelect(prevData => prevData.map(item =>
            item.Telefono === Telefono
                ? { ...item, checkToSend: !item.checkToSend }
                : item
        ))
    }

    //Manejar el checkbox de "Marcar todos"
    const handleCheckAll = () => {
        const newCheckState = !allChecked; //cambio de estado en general
        setAllChecked(newCheckState)
        setDataSelect(prevData => prevData.map( item => ({
            ...item,
            checkToSend: newCheckState,  // marcar o desmarcar todos
        })))
    }

    //Boton de enviar 
    const handleButtonCharge = async () => {
        try {
            const results = await Promise.all(
                filteredContacts.map(async (contact) => {
                    if (contact.checkToSend) {


                        //saco filtro del almacen para crear un json del stock del almacen
                        // const resultByAlmacen = jsonData.filter(
                        //     material => contact.Almacén === material.Almacén && contact.checkToSend
                        // );
                        
                        //TODO --> envio texto a la funcion 
                        const jsonDataSend = {...contact}
                        const res = await reportByNumber(contact.Telefono, contact.Nombre, jsonDataSend);

                        if (res.messageSent) {
                            //Actualizar estado con el identificador unico (almacen)
                            setDataSelect(prevData => prevData.map(item =>
                                item.Telefono === contact.Telefono ? { ...item, isSend: true } : item
                            ))
                        }
                        console.log(res)
                        return res;
                    }
                })
            )
            if (results) setButtonDisableReport(!buttonDisableReport)
        } catch (error) {
            console.error("Error al enviar los reportes: ", error)
        }
    }


    //filtrar contactos por supervisor seleccionado
    const filteredContacts = useMemo(
        () =>
            selectedSupervisor ?
                dataSelect.filter(contact => contact.Supervisor === selectedSupervisor)
                : dataSelect,
        [dataSelect, selectedSupervisor]
    )

    //
    return (
        <div style={{ margin: '20px' }}>
            <Dropdown
                placeholder="Seleccionar Supervisor"
                fluid
                selection
                options={supervisors}
                onChange={(e, { value }) => setSelectedSupervisor(value)}
                clearable
            />
            <Table compact striped>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell>
                            <Checkbox 
                                checked={allChecked}  //Estado general de "CHECK'S"
                                onChange={handleCheckAll}  //Manejar los cambios
                            />
                        </TableHeaderCell> 
                        <TableHeaderCell>Nombre</TableHeaderCell>
                        <TableHeaderCell>Técnico</TableHeaderCell>
                        <TableHeaderCell>Teléfono</TableHeaderCell>
                        <TableHeaderCell>Supervisor</TableHeaderCell>
                        <TableHeaderCell>Enviado</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredContacts.map((contact, index) => (
                        (contact.Telefono && contact.Nombre) && (
                            <TableRow key={contact.Telefono}>
                                <TableCell>
                                    <Checkbox
                                        checked={contact.checkToSend} //establecer el estado si esta marcado
                                        onChange={() => handleCheckboxChange(contact.Telefono)}  //manejar los cambios
                                    />
                                </TableCell>
                                <TableCell>{contact.Nombre}</TableCell>
                                <TableCell>{contact.Tecnico}</TableCell>
                                <TableCell>{contact.Telefono}</TableCell>
                                <TableCell>{contact.Supervisor}</TableCell>
                                <TableCell>
                                    {contact.isSend && (
                                        <Icon color='green' name='checkmark' size='large' />
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                </TableBody>
            </Table>

            {(jsonDataContact !== undefined) && (
                <Button primary
                    disabled={buttonDisableReport}
                    onClick={handleButtonCharge}
                >
                    Enviar Reporte
                </Button>
            )}
        </div>
    )
}
