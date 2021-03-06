import { useState, useEffect } from 'react';
import { DataGrid } from '@material-ui/data-grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { map, find } from 'lodash';

import CBSelect from '../components/CBSelect';
import Layout from '../components/Layout';
import SearchInput from '../components/SearchInput';
import UserProfileDialog from '../dialogs/UserProfileDialog';
import { getUsers, getUserRegisteredIdeasAndComments, getUsersByPhonenumber, getUsersByNickname } from '../firebase/users';
import { User } from '../models/User';
import { IconButton } from '@material-ui/core';
import { Refresh } from '@material-ui/icons';

const columns = [
    { field: 'id', headerName: '번호', width: 300 },
    // {
    //   field: 'pick',
    //   headerName: 'pick 여부',
    //   width: 100,
    //   editable: true,
    // },
    {
      field: 'nickName',
      headerName: '닉네임',
      width: 150,
      editable: false,
    },
    {
      field: 'gender',
      headerName: '성별',
      type: 'number',
      width: 110,
      editable: false,
    },
    {
      field: 'yearsOnJob',
      headerName: '연차',
      width: 160,
    },
    {
        field: 'department',
        headerName: '간호 직군',
        width: 150,
        editable: false,
    },
    {
        field: 'phoneNumber',
        headerName: '휴대폰 번호',
        width: 250,
        editable: false,
    },
    {
        field: 'registeredIdeaCount',
        headerName: '등록 아이디어 수',
        width: 250,
        editable: false,
    },
    {
        field: 'registeredCommentCount',
        headerName: '등록 코멘트 수',
        width: 250,
        editable: false,
    }, 
    {
        field: 'registrationDate',
        headerName: '가입일',
        width: 250,
        editable: false,
    }, 
    {
        field: 'lastLoginTime',
        headerName: '최근 로그인',
        width: 250,
        editable: false,
    },   
];

export default function UserListPage() {

    const [ open, setOpen ] = useState(false);
    const [ users, setUsers ] = useState([]);

    const [ formattedUsers, setFormattedUser ] = useState([]);

    const [ selectedRow, setSelectedRow ] = useState();

    const [ searchingType, setSearchingType ] = useState();


    useEffect(() => {
        getUsers().then(setUsers);
    }, []);

    const getIdeasAndCommentsCount = async (user) => {
        const { ideas, comments } = await getUserRegisteredIdeasAndComments(user.id);
        user.registeredIdeaCount = ideas;
        user.registeredCommentCount = comments;
    };

    useEffect(() => {
        const promises = map(formattedUsers, getIdeasAndCommentsCount);
        Promise.all(promises);
    }, [formattedUsers]);

    useEffect(() => {
        const data = map(users, user => {
            const row = new User(user);

            return ({
                id: row.uid,
                // pick: 'pick',
                nickName: row.nickName,
                gender: row.gender,
                yearsOnJob: row.yearsOnJob,
                department: row.department,
                phoneNumber: row.phoneNumber,
                registeredIdeaCount: 0,
                registeredCommentCount: 0,
                registrationDate: row.registrationDate,
                lastLoginTime: row.lastLoginTime,
                grade: row.grade,
                profileImageUrl: row.profileImageUrl
            });
        });

        setFormattedUser(data);
    }, [users]);

    const searchForUser = async (searchingText) => {
        let users = [];
        switch(searchingType){
            case 'phoneNumber':
                users = await getUsersByPhonenumber(searchingText);
                setUsers(users);
                break;
            case 'nickName':
                users = await getUsersByNickname(searchingText);
                break;
        }
        setUsers(users);
    };

    return (
        <Layout>
            <div style={{display: 'flex', flexDirection: 'column', padding: 20, flex: 1}}>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        <span style={{fontSize: 26, fontWeight: 'bold'}}>회원 리스트</span>
                        <IconButton onClick={() => getUsers().then(setUsers)}>
                            <Refresh />
                        </IconButton>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        {/* <FormControlLabel
                            value="start"
                            control={<Switch color="primary" />}
                            label="pick된 회원만 보기"
                            labelPlacement="start"
                            style={{marginRight: 16}}
                        /> */}
                        <CBSelect containerStyle={{marginRight: 8}} onValueChange={setSearchingType}/>
                        <SearchInput onSearch={searchForUser}/>
                    </div>
                </div>
                <div style={{ flex: 1, marginTop: 24 }}>
                    <DataGrid
                        rows={formattedUsers}
                        columns={columns}
                        pageSize={10}
                        onRowClick={(param) => {
                            setOpen(true)
                            setSelectedRow(param.row);
                        }}
                    />
                </div>

            <UserProfileDialog
                {...{open, setOpen}}
                data={selectedRow}
                onUpdateGrade={(uid, grade) => {
                    console.log(uid, grade);
                    const user = find(formattedUsers, user => user.id === uid);
                    user.grade = grade;
                }}
            />    
            </div>
        </Layout>
    )
}